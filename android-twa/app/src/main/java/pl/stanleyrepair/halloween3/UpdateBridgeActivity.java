package pl.stanleyrepair.halloween3;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.view.Gravity;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.core.content.FileProvider;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class UpdateBridgeActivity extends Activity {
    private static final int REQUEST_UNKNOWN_APPS = 5201;
    private String apkUrl;
    private String version;
    private boolean downloadStarted = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        renderDownloadingScreen();

        Uri data = getIntent() != null ? getIntent().getData() : null;
        apkUrl = data != null ? data.getQueryParameter("url") : null;
        version = data != null ? data.getQueryParameter("version") : null;

        if (!isAllowedApkUrl(apkUrl)) {
            fail("Nieprawidłowy adres aktualizacji.");
            return;
        }

        ensureInstallPermissionThenDownload();
    }

    private void renderDownloadingScreen() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER);
        root.setPadding(48, 48, 48, 48);
        root.setBackgroundColor(Color.rgb(9, 7, 6));

        ProgressBar progress = new ProgressBar(this);
        LinearLayout.LayoutParams progressParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        progressParams.bottomMargin = 28;
        root.addView(progress, progressParams);

        TextView title = new TextView(this);
        title.setText("Pobieranie aktualizacji Halloween 3.0…");
        title.setTextColor(Color.WHITE);
        title.setTextSize(18);
        title.setGravity(Gravity.CENTER);
        root.addView(title);

        TextView subtitle = new TextView(this);
        subtitle.setText("Po pobraniu automatycznie otworzy się instalator Androida.");
        subtitle.setTextColor(Color.rgb(190, 170, 150));
        subtitle.setTextSize(13);
        subtitle.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams subtitleParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        subtitleParams.topMargin = 14;
        root.addView(subtitle, subtitleParams);

        setContentView(root);
    }

    private boolean isAllowedApkUrl(String value) {
        if (value == null || value.isBlank()) return false;
        try {
            Uri uri = Uri.parse(value);
            String path = uri.getPath();
            return "https".equalsIgnoreCase(uri.getScheme())
                    && "github.com".equalsIgnoreCase(uri.getHost())
                    && path != null
                    && path.startsWith("/StanleyRepair/Halloween-3.0/releases/download/android-v")
                    && path.endsWith("/Halloween-3.0.apk");
        } catch (Exception ignored) {
            return false;
        }
    }

    private void ensureInstallPermissionThenDownload() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                && !getPackageManager().canRequestPackageInstalls()) {
            try {
                Intent intent = new Intent(
                        Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                        Uri.parse("package:" + getPackageName())
                );
                startActivityForResult(intent, REQUEST_UNKNOWN_APPS);
                return;
            } catch (Exception e) {
                fail("Android nie pozwolił otworzyć ustawienia instalowania aplikacji.");
                return;
            }
        }
        startDownload();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQUEST_UNKNOWN_APPS) return;

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O
                || getPackageManager().canRequestPackageInstalls()) {
            startDownload();
        } else {
            fail("Zezwól Halloween 3.0 na instalowanie aplikacji z tego źródła.");
        }
    }

    private void startDownload() {
        if (downloadStarted) return;
        downloadStarted = true;

        new Thread(() -> {
            File target = new File(getCacheDir(), "Halloween-3.0-update.apk");
            HttpURLConnection connection = null;
            try {
                if (target.exists() && !target.delete()) {
                    throw new IllegalStateException("Nie można usunąć starego pliku aktualizacji");
                }

                URL url = new URL(apkUrl);
                connection = (HttpURLConnection) url.openConnection();
                connection.setInstanceFollowRedirects(true);
                connection.setConnectTimeout(15000);
                connection.setReadTimeout(45000);
                connection.setRequestProperty("User-Agent", "Halloween3-Android-Updater/" + BuildConfig.VERSION_NAME);
                connection.connect();

                int status = connection.getResponseCode();
                if (status < 200 || status >= 300) {
                    throw new IllegalStateException("HTTP " + status);
                }

                try (InputStream input = connection.getInputStream();
                     FileOutputStream output = new FileOutputStream(target)) {
                    byte[] buffer = new byte[64 * 1024];
                    int read;
                    while ((read = input.read(buffer)) != -1) {
                        output.write(buffer, 0, read);
                    }
                    output.flush();
                }

                if (!target.exists() || target.length() < 100_000) {
                    throw new IllegalStateException("Niepełny plik APK");
                }

                runOnUiThread(() -> launchInstaller(target));
            } catch (Exception e) {
                runOnUiThread(() -> fail("Nie udało się pobrać aktualizacji. Spróbuj ponownie."));
            } finally {
                if (connection != null) connection.disconnect();
            }
        }).start();
    }

    private void launchInstaller(File apk) {
        try {
            Uri contentUri = FileProvider.getUriForFile(
                    this,
                    getPackageName() + ".fileprovider",
                    apk
            );
            Intent install = new Intent(Intent.ACTION_VIEW);
            install.setDataAndType(contentUri, "application/vnd.android.package-archive");
            install.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            startActivity(install);
            finish();
        } catch (Exception e) {
            fail("Plik został pobrany, ale nie udało się otworzyć instalatora Androida.");
        }
    }

    private void fail(String message) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show();
        finish();
    }
}
