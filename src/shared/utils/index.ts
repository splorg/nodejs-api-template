import { type Express} from "express";
import chalk from "chalk";

export const logRoutes = (app: Express) => {
  const routes: { method: string; path: string }[] = [];

  app._router.stack.forEach((middleware: any) => {
    if (middleware.route) {
      const methods = Object.keys(middleware.route.methods);
      routes.push({
        method: methods[0].toUpperCase(),
        path: middleware.route.path,
      });
    } else if (middleware.name === "router") {
      const basePath = middleware.regexp.toString()
        .split("?")[0]
        .replaceAll("\\", "")
        .replaceAll("/^", "")
        .replaceAll("$/i", "");
      
      middleware.handle.stack.forEach((handler: any) => {
        if (handler.route) {
          const methods = Object.keys(handler.route.methods);
          const fullPath = `${basePath}${handler.route.path}`
            .replace(/\/+/g, '/');
          
          routes.push({
            method: methods[0].toUpperCase(),
            path: fullPath,
          });
        }
      });
    }
  });

  const groupedRoutes: { [key: string]: typeof routes } = {};
  routes.forEach(route => {
    const [, baseGroup = ''] = route.path.match(/^\/([^/]+)/) || [];
    if (!groupedRoutes[baseGroup]) {
      groupedRoutes[baseGroup] = [];
    }
    groupedRoutes[baseGroup].push(route);
  });

  Object.keys(groupedRoutes).sort().forEach(group => {
    groupedRoutes[group].sort((a, b) => {
      if (a.method === b.method) {
        return a.path.localeCompare(b.path);
      }
      return a.method.localeCompare(b.method);
    });
  });

  Object.keys(groupedRoutes).forEach(group => {
    console.log(chalk.bold.blue(`\n/${group}`));
    
    groupedRoutes[group].forEach(({ method, path }) => {
      const methodColor = 
        method === "GET" ? "green" :
        method === "POST" ? "yellow" :
        method === "PUT" ? "blue" :
        method === "PATCH" ? "cyan" :
        method === "DELETE" ? "red" :
        "white";

      const displayPath = path.replace(new RegExp(`^/${group}`), '');
      
      console.log(
        `  ${chalk[methodColor].bold(method.padEnd(7))} ${chalk.gray(displayPath || '/')}`
      );
    });
  });
  console.log();
}