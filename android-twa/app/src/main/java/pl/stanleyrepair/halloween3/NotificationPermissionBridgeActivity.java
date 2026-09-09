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

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(
                    new String[]{Manifest.permission.POST_NOTIFICATIONS},
                    REQUEST_NOTIFICATIONS
            );
            return;
        }

        returnToTwa(true);
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
                "https://stanleyrepair.github.io/Halloween-3.0/?h3apk=1&h3nativepush="
                        + (granted ? "granted" : "denied")
        );

        Intent intent = new Intent(
                this,
                com.google.androidbrowserhelper.trusted.LauncherActivity.class
        );
        intent.setAction(Intent.ACTION_VIEW);
        intent.setData(returnUrl);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        startActivity(intent);
        finish();
    }
}
