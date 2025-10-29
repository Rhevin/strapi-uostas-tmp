const strapi = require('@strapi/strapi');

strapi.createStrapi({
    // Set the application directory (where your config, src, etc. are located)
    appDir: __dirname,
    // Optionally set the dist directory if you're using TypeScript
    distDir: './dist',
    // Auto reload is typically disabled in production
    autoReload: false,
    // Serve the admin panel
    serveAdminPanel: true,
}).start();
