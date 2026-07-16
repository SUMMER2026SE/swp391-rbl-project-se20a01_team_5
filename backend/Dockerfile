FROM maven:3.9.11-eclipse-temurin-21 AS build

WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre

WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["sh", "-c", "if [ -n \"$GOOGLE_APPLICATION_CREDENTIALS_JSON\" ]; then printf %s \"$GOOGLE_APPLICATION_CREDENTIALS_JSON\" > /tmp/google-vision.json; export GOOGLE_APPLICATION_CREDENTIALS=/tmp/google-vision.json; fi; exec java -jar /app/app.jar"]
