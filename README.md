# Alex J Collection

A static football shirt collection website built from public posts by `@alexjcollection`.

## Deploy on GitHub Pages

This repository includes a GitHub Pages workflow. To publish it:

1. Create a public GitHub repository.
2. Push this folder to the repository's `main` branch.
3. In GitHub, open `Settings > Pages`.
4. Set `Source` to `GitHub Actions`.
5. Open the `Actions` tab and run `Deploy to GitHub Pages`, or push another commit to `main`.

The public URL will usually be:

```text
https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPOSITORY_NAME/
```

After the URL is final, update the Open Graph image in `index.html` to an absolute URL if you want richer previews in apps that require one.

## Local Preview

```bash
npm start
```

Then open `http://localhost:4173`.
