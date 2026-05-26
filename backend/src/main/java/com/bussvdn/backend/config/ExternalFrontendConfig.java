package com.bussvdn.backend.config;

import java.nio.file.Files;
import java.nio.file.Path;
import org.apache.catalina.WebResourceRoot;
import org.apache.catalina.webresources.DirResourceSet;
import org.apache.catalina.webresources.StandardRoot;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ExternalFrontendConfig implements WebServerFactoryCustomizer<TomcatServletWebServerFactory> {
    @Override
    public void customize(TomcatServletWebServerFactory factory) {
        factory.addContextCustomizers(context -> {
            Path frontendPath = resolveFrontendPath();
            if (!Files.isDirectory(frontendPath)) {
                return;
            }
            WebResourceRoot resources = context.getResources();
            if (resources == null) {
                resources = new StandardRoot(context);
                context.setResources(resources);
            }
            resources.addPreResources(new DirResourceSet(
                    resources,
                    "/frontend",
                    frontendPath.toAbsolutePath().toString(),
                    "/"));
        });
    }

    private Path resolveFrontendPath() {
        Path current = Path.of(System.getProperty("user.dir")).toAbsolutePath().normalize();
        Path fromBackend = current.resolve("../frontend").normalize();
        if (Files.isDirectory(fromBackend)) {
            return fromBackend;
        }
        return current.resolve("frontend").normalize();
    }
}
