# Run Expo dev server inside container (serves web on 19006)
FROM node:22

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 19006
CMD ["npm", "start"]