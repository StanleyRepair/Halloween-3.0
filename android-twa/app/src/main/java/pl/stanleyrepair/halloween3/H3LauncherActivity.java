package pl.stanleyrepair.halloween3;

import android.Manifest;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;

public class H3LauncherActivity extends com.google.androidbrowserhelper.trusted.LauncherActivity {
    @Override
    protected Uri getLaunchingUrl() {
        Uri uri = super.getLaunchingUrl();
        boolean notificationsGranted = Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU
                || checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                == PackageManager.PERMISSION_GRANTED;

        return uri.buildUpon()
                .appendQueryParameter("h3apk", "1")
                .appendQueryParameter("h3appver", BuildConfig.VERSION_NAME)
                .appendQueryParameter("h3appcode", String.valueOf(BuildConfig.VERSION_CODE))
                .appendQueryParameter("h3nativepush", notificationsGranted ? "granted" : "denied")
                .appendQueryParameter("h3nativepush_nonce", String.valueOf(System.currentTimeMillis()))
                .build();
    }
}
