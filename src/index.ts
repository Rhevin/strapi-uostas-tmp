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

    // Auto-configure public permissions for posts API
    const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { type: 'public' },
    });

    const authenticatedRole = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { type: 'authenticated' },
    });

    if (publicRole) {
      const publicPermissions = await strapi.db.query('plugin::users-permissions.permission').findMany({
        where: {
          role: publicRole.id,
          action: {
            $in: ['api::post.post.find', 'api::post.post.findOne'],
          },
        },
      });

      // Enable public access to posts if not already enabled
      const actions = ['api::post.post.find', 'api::post.post.findOne'];
      for (const action of actions) {
        const existingPermission = publicPermissions.find(p => p.action === action);
        if (!existingPermission) {
          await strapi.db.query('plugin::users-permissions.permission').create({
            data: {
              action: action,
              role: publicRole.id,
              enabled: true,
            },
          });
        } else if (!existingPermission.enabled) {
          await strapi.db.query('plugin::users-permissions.permission').update({
            where: { id: existingPermission.id },
            data: { enabled: true },
          });
        }
      }
      strapi.log.info('✅ Enabled public access to posts API');
    }

    if (authenticatedRole) {
      const authPermissions = await strapi.db.query('plugin::users-permissions.permission').findMany({
        where: {
          role: authenticatedRole.id,
          action: {
            $in: ['api::post.post.find', 'api::post.post.findOne'],
          },
        },
      });

      // Enable authenticated access to posts if not already enabled
      const actions = ['api::post.post.find', 'api::post.post.findOne'];
      for (const action of actions) {
        const existingPermission = authPermissions.find(p => p.action === action);
        if (!existingPermission) {
          await strapi.db.query('plugin::users-permissions.permission').create({
            data: {
              action: action,
              role: authenticatedRole.id,
              enabled: true,
            },
          });
        } else if (!existingPermission.enabled) {
          await strapi.db.query('plugin::users-permissions.permission').update({
            where: { id: existingPermission.id },
            data: { enabled: true },
          });
        }
      }
      strapi.log.info('✅ Enabled authenticated access to posts API');
    }
  },
};
