package pl.stanleyrepair.halloween3;

import android.Manifest;
import android.app.Activity;
import android.content.ComponentName;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.browser.customtabs.CustomTabsCallback;
import androidx.browser.customtabs.CustomTabsClient;
import androidx.browser.customtabs.CustomTabsService;
import androidx.browser.customtabs.CustomTabsServiceConnection;
import androidx.browser.customtabs.CustomTabsSession;
import androidx.browser.trusted.TrustedWebActivityIntentBuilder;

public class H3LauncherActivity extends Activity {
    private static final String TAG = "H3NativeBridge";
    private static final Uri ORIGIN = Uri.parse("https://stanleyrepair.github.io");
    private static final Uri APP_HOME = Uri.parse("https://stanleyrepair.github.io/Halloween-3.0/");
    private CustomTabsClient client;
    private CustomTabsSession session;
    private boolean channelRequested;

    private final CustomTabsCallback callback = new CustomTabsCallback() {
        @Override public void onRelationshipValidationResult(int relation, @NonNull Uri requestedOrigin, boolean result, @Nullable Bundle extras) { Log.d(TAG, "Origin validation: " + result); }
        @Override public void onNavigationEvent(int navigationEvent, @Nullable Bundle extras) {
            if (navigationEvent != NAVIGATION_FINISHED || session == null || channelRequested) return;
            channelRequested = true;
            Log.d(TAG, "PostMessage request: " + session.requestPostMessageChannel(ORIGIN, ORIGIN, new Bundle()));
        }
        @Override public void onMessageChannelReady(@Nullable Bundle extras) { if (session != null) session.postMessage("H3_NATIVE_BRIDGE_READY", null); }
        @Override public void onPostMessage(@NonNull String message, @Nullable Bundle extras) {
            if (!message.startsWith("H3_UPDATE\n")) return;
            String[] parts = message.split("\n", 3); if (parts.length != 3) return;
            Uri updateUri = new Uri.Builder().scheme("halloween3").authority("update").appendQueryParameter("url", parts[1]).appendQueryParameter("version", parts[2]).build();
            Intent update = new Intent(H3LauncherActivity.this, UpdateBridgeActivity.class); update.setData(updateUri); startActivity(update);
        }
    };

    @Override protected void onCreate(Bundle savedInstanceState) { super.onCreate(savedInstanceState); bindAndLaunch(); }

    private Uri launchUrl() {
        boolean granted = Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU || checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
        Uri incoming = getIntent()!=null ? getIntent().getData() : null;
        Uri base = incoming!=null && "https".equals(incoming.getScheme()) ? incoming : APP_HOME;
        String path = base.getPath();
        if (path != null && (path.equals("/Halloween-3.0/install") || path.startsWith("/Halloween-3.0/install/"))) base = APP_HOME;
        return base.buildUpon().appendQueryParameter("h3apk","1").appendQueryParameter("h3appver",BuildConfig.VERSION_NAME).appendQueryParameter("h3appcode",String.valueOf(BuildConfig.VERSION_CODE)).appendQueryParameter("h3nativepush",granted?"granted":"denied").appendQueryParameter("h3nativepush_nonce",String.valueOf(System.currentTimeMillis())).build();
    }

    private void bindAndLaunch() {
        String provider = CustomTabsClient.getPackageName(this, null);
        if (provider == null) { startActivity(new Intent(Intent.ACTION_VIEW, launchUrl())); finish(); return; }
        CustomTabsClient.bindCustomTabsService(this, provider, new CustomTabsServiceConnection() {
            @Override public void onCustomTabsServiceConnected(@NonNull ComponentName name, @NonNull CustomTabsClient c) {
                client=c; client.warmup(0L); session=client.newSession(callback);
                if(session==null){startActivity(new Intent(Intent.ACTION_VIEW,launchUrl()));finish();return;}
                session.validateRelationship(CustomTabsService.RELATION_USE_AS_ORIGIN, ORIGIN, new Bundle());
                new TrustedWebActivityIntentBuilder(launchUrl()).build(session).launchTrustedWebActivity(H3LauncherActivity.this);
            }
            @Override public void onServiceDisconnected(ComponentName name){client=null;session=null;}
        });
    }
}
