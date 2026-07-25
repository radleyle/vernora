# ---------- Stage 1: build ----------
# Full JDK + Gradle wrapper compile the jar. None of this ships.
FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace

# Copy the build definition first, source second. Docker caches layers by
# content: as long as the build files don't change, the (slow) dependency
# download layer is reused across builds even when source code changes.
COPY gradlew settings.gradle.kts build.gradle.kts ./
COPY gradle gradle
RUN ./gradlew --no-daemon dependencies --quiet || true

COPY src src
RUN ./gradlew --no-daemon bootJar

# ---------- Stage 2: runtime ----------
# JRE only: no compiler, no Gradle, no source. Smaller image, smaller
# attack surface.
FROM eclipse-temurin:21-jre
WORKDIR /app

# Run as a non-root user; containers should not have root by default.
RUN useradd --system --uid 1001 vernora
USER vernora

COPY --from=build /workspace/build/libs/*.jar app.jar

# Free-tier containers have little RAM (Render: 512MB). Let the JVM use 75%
# of whatever the container is given instead of its conservative default.
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75"

# Render (and most PaaS) inject PORT; application.yaml maps it to server.port.
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
