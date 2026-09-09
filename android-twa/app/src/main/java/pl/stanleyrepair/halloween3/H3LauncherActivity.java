package pl.stanleyrepair.halloween3;

import android.net.Uri;

public class H3LauncherActivity extends com.google.androidbrowserhelper.trusted.LauncherActivity {
    @Override
    protected Uri getLaunchingUrl() {
        Uri uri = super.getLaunchingUrl();
        return uri.buildUpon()
                .appendQueryParameter("h3apk", "1")
                .appendQueryParameter("h3appver", BuildConfig.VERSION_NAME)
                .appendQueryParameter("h3appcode", String.valueOf(BuildConfig.VERSION_CODE))
                .build();
    }
}
