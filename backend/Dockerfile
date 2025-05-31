# Use GraalVM Community Edition with Java 17
FROM ghcr.io/graalvm/graalvm-community:17-ol9 AS build

# Install Maven and network tools
RUN microdnf install -y wget tar curl && \
    wget https://archive.apache.org/dist/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.tar.gz && \
    tar -xzf apache-maven-3.9.6-bin.tar.gz -C /opt && \
    ln -s /opt/apache-maven-3.9.6 /opt/maven && \
    rm apache-maven-3.9.6-bin.tar.gz

# Set Maven environment with network settings
ENV MAVEN_HOME=/opt/maven
ENV PATH=$MAVEN_HOME/bin:$PATH
ENV MAVEN_OPTS="-Dmaven.wagon.http.retryHandler.count=3 -Dmaven.wagon.httpconnectionManager.ttlSeconds=120"

# Create Maven settings.xml to use Aliyun mirror (faster in Asia)
# RUN mkdir -p /root/.m2 && \
#     echo '<?xml version="1.0" encoding="UTF-8"?>' > /root/.m2/settings.xml && \
#     echo '<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"' >> /root/.m2/settings.xml && \
#     echo '          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' >> /root/.m2/settings.xml && \
#     echo '          xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 http://maven.apache.org/xsd/settings-1.0.0.xsd">' >> /root/.m2/settings.xml && \
#     echo '  <mirrors>' >> /root/.m2/settings.xml && \
#     echo '    <mirror>' >> /root/.m2/settings.xml && \
#     echo '      <id>aliyunmaven</id>' >> /root/.m2/settings.xml && \
#     echo '      <mirrorOf>central</mirrorOf>' >> /root/.m2/settings.xml && \
#     echo '      <name>Aliyun Maven Repository</name>' >> /root/.m2/settings.xml && \
#     echo '      <url>https://maven.aliyun.com/repository/public</url>' >> /root/.m2/settings.xml && \
#     echo '    </mirror>' >> /root/.m2/settings.xml && \
#     echo '    <mirror>' >> /root/.m2/settings.xml && \
#     echo '      <id>aliyun-spring</id>' >> /root/.m2/settings.xml && \
#     echo '      <mirrorOf>spring-milestones,spring-snapshots</mirrorOf>' >> /root/.m2/settings.xml && \
#     echo '      <name>Aliyun Spring Repository</name>' >> /root/.m2/settings.xml && \
#     echo '      <url>https://maven.aliyun.com/repository/spring</url>' >> /root/.m2/settings.xml && \
#     echo '    </mirror>' >> /root/.m2/settings.xml && \
#     echo '  </mirrors>' >> /root/.m2/settings.xml && \
#     echo '</settings>' >> /root/.m2/settings.xml

# Set working directory
WORKDIR /app

# Copy Maven configuration files
COPY pom.xml ./
COPY mvnw ./
COPY mvnw.cmd ./
COPY .mvn .mvn

# Download dependencies using Aliyun mirror (much faster in Asia)
RUN mvn dependency:resolve -B -U || \
    # mvn dependency:go-offline -B -U || \
    echo "Dependencies will be downloaded during build"

# Copy source code
COPY src ./src

# Build the application with network retry settings
RUN mvn clean package -DskipTests -B -U \
    -Dmaven.wagon.http.retryHandler.count=5 \
    -Dmaven.wagon.http.pool=false

# Runtime stage using GraalVM
FROM ghcr.io/graalvm/graalvm-community:17-ol9

# Install necessary packages
RUN microdnf install -y shadow-utils curl && \
    microdnf clean all

# Create a non-root user
RUN useradd -m -s /bin/bash appuser

# Set working directory
WORKDIR /app

# Copy the built JAR from build stage
COPY --from=build /app/target/backend-*.jar app.jar

# Create uploads directory
RUN mkdir -p uploads && chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port 8080
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
