FROM node:24.22.1-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --chown=node:node . .
USER node
ENV PORT=8080
EXPOSE 8080
CMD ["npm", "start"]
