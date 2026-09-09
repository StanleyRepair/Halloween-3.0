package pl.stanleyrepair.halloween3;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;

public class PermissionGateActivity extends Activity {
    private static final int REQUEST_NOTIFICATIONS = 3001;
    private boolean launched;

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

        launchTwa();
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQUEST_NOTIFICATIONS) {
            launchTwa();
        }
    }

    private void launchTwa() {
        if (launched) return;
        launched = true;

        Intent source = getIntent();
        Intent twa = new Intent(this, com.google.androidbrowserhelper.trusted.LauncherActivity.class);

        if (source != null && source.getData() != null) {
            twa.setAction(Intent.ACTION_VIEW);
            twa.setData(source.getData());
        } else {
            twa.setAction(Intent.ACTION_MAIN);
        }

        startActivity(twa);
        finish();
    }
}
