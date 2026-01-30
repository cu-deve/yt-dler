FROM node:20-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y yt-dlp ffmpeg python3 && \
    apt-get clean

COPY package.json ./
RUN npm install

COPY . .

EXPOSE 8080
CMD ["npm", "start"]
