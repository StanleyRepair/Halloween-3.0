package pl.stanleyrepair.halloween3;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;

public class NotificationPermissionBridgeActivity extends Activity {
    private static final int REQUEST_NOTIFICATIONS = 4101;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Uri data = getIntent() != null ? getIntent().getData() : null;
        boolean checkOnly = data != null && "check".equals(data.getQueryParameter("mode"));
        boolean granted = Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU
                || checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                == PackageManager.PERMISSION_GRANTED;

        if (granted) {
            returnToTwa(true);
            return;
        }

        if (checkOnly) {
            returnToTwa(false);
            return;
        }

        requestPermissions(
                new String[]{Manifest.permission.POST_NOTIFICATIONS},
                REQUEST_NOTIFICATIONS
        );
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != REQUEST_NOTIFICATIONS) return;

        boolean granted = grantResults.length > 0
                && grantResults[0] == PackageManager.PERMISSION_GRANTED;
        returnToTwa(granted);
    }

    private void returnToTwa(boolean granted) {
        Uri returnUrl = Uri.parse(
                "https://stanleyrepair.github.io/Halloween-3.0/?h3nativepush="
                        + (granted ? "granted" : "denied")
                        + "&h3nativepush_nonce=" + System.currentTimeMillis()
        );

        Intent intent = new Intent(this, H3LauncherActivity.class);
        intent.setAction(Intent.ACTION_VIEW);
        intent.setData(returnUrl);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }
}
