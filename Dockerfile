# Multi-stage build for the Jeff Nippard tracker
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist .

EXPOSE 8004
CMD ["nginx", "-g", "daemon off;"]
