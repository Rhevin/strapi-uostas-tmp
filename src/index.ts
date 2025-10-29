export default {
  register({ strapi }) {
    // Force the socket to be treated as encrypted for proxy setups
    strapi.server.use(async (ctx, next) => {
      if (ctx.req?.socket) {
        (ctx.req.socket as any).encrypted = true;
      }
      await next();
    });
  },

  async bootstrap({ strapi }) {
    // Auto-create admin user if none exists
    const admins = await strapi.db.query('admin::user').findMany();
    
    if (admins.length === 0) {
      const params = {
        username: strapi.config.get('admin.defaultUsername', 'admin'),
        password: strapi.config.get('admin.defaultPassword', 'Admin123!'),
        firstname: strapi.config.get('admin.defaultFirstname', 'Admin'),
        lastname: strapi.config.get('admin.defaultLastname', 'User'),
        email: strapi.config.get('admin.defaultEmail', 'admin@example.com'),
        blocked: false,
        isActive: true,
      };

      const hasAdminRolePermission = await strapi
        .service('admin::permission')
        .actionProvider.has('admin::users.create');

      if (hasAdminRolePermission) {
        const superAdminRole = await strapi.db.query('admin::role').findOne({
          where: { code: 'strapi-super-admin' },
        });

        params['roles'] = [superAdminRole.id];

        await strapi.service('admin::user').create(params);
        
        strapi.log.info('✅ Auto-created admin user:');
        strapi.log.info(`   Email: ${params.email}`);
        strapi.log.info(`   Password: ${params.password}`);
      }
    }
  },
};