# Deploying to Firebase App Hosting

This project is configured to deploy the Next.js frontend and any associated Firebase services through **Firebase App Hosting**. Follow the steps below to publish the site.

> **Quick checklist**
>
> 1. You can build the app locally with `npm run build`.
> 2. The Firebase CLI is installed and you are signed in to the correct project.
> 3. Any required environment secrets are configured in App Hosting.
>
> If every item above is true, you're ready to deploy with the command in [Step&nbsp;4](#4-deploy-the-application).

## 1. Install the Firebase CLI

```bash
npm install -g firebase-tools
```

Confirm the installation:

```bash
firebase --version
```

## 2. Authenticate and select your project

Log in to Firebase and choose the project you want to use. If you already have a Firebase project, replace `<project-id>` with its ID. If you need to create a project, do so from the [Firebase console](https://console.firebase.google.com/) first.

If you are unsure which project to target, list the projects that are available to your account:

```bash
firebase projects:list
```

```bash
firebase login
firebase use --add <project-id>
```

## 3. Configure required environment secrets (optional)

If your app relies on environment variables, set them up as [App Hosting secrets](https://firebase.google.com/docs/app-hosting/environment-variables) so that they are available during build and runtime:

```bash
firebase apphosting:secrets:set <SECRET_NAME>
```

Repeat for each secret, following the prompts to provide the values. You can review existing secrets with:

```bash
firebase apphosting:secrets:list
```

### Provide Firebase Admin credentials

Server-side features that access Firestore or Cloud Storage require Firebase Admin credentials. You can provide them in one of two ways:

1. **Service account JSON (recommended for App Hosting)** – download a service account key from the Firebase console and store it as the `FIREBASE_SERVICE_ACCOUNT` secret. The value must be the raw JSON string (not base64-encoded). For example:

   ```bash
   firebase apphosting:secrets:set FIREBASE_SERVICE_ACCOUNT --data-file service-account.json
   ```

   For local development, add the same JSON to your `.env.local` file:

   ```bash
   FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
   ```

   Never commit the JSON file or the `.env.local` file to version control.

2. **Application Default Credentials (ADC)** – alternatively, configure [Application Default Credentials](https://cloud.google.com/docs/authentication/provide-credentials-adc) on the deployment environment. When ADC is available, the app automatically picks it up without `FIREBASE_SERVICE_ACCOUNT`.

If neither a service account nor ADC is available, the project falls back to the Firebase emulators (when running locally with the emulators configured).

## 4. Deploy the application

App Hosting automatically runs the production build for your Next.js app. If you want to double-check the build locally, run `npm run build` once before deploying. Then deploy using:

```bash
firebase deploy --only apphosting
```

To deploy Firestore security rules, indexes, or Cloud Functions alongside the app, include them in the `--only` flag, for example:

```bash
firebase deploy --only apphosting,firestore,functions
```

## 5. Verify the deployment

Once the command completes, the CLI outputs the hosting URL. Open it in your browser to confirm that the site is live. You can manage subsequent deployments with the same `firebase deploy --only apphosting` command whenever changes are ready to publish.

## Troubleshooting tips

- Run `firebase logout` and `firebase login` if you encounter authentication errors.
- Ensure your local Node.js version matches the requirement in `package.json` (`>=20.18.0`).
- Use `firebase deploy --only apphosting --debug` for verbose logs when debugging deployment issues.

