# Halloween 3.0 Android TWA

Android package: `pl.stanleyrepair.halloween3`

Default URL: `https://stanleyrepair.github.io/Halloween-3.0/`

The APK is a Trusted Web Activity wrapper around the existing web app. Web content updates independently from the APK.

The release APK is signed in GitHub Actions with repository secrets and the signing key is intentionally not stored in GitHub.

Required repository secrets:

`H3_KEYSTORE_BASE64`

`H3_KEYSTORE_PASSWORD`

`H3_KEY_ALIAS`

`H3_KEY_PASSWORD`

Build workflow: Actions -> Build Android APK -> Run workflow.

Android App Links are verified by `https://stanleyrepair.github.io/.well-known/assetlinks.json`.
