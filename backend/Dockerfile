FROM node:18-slim

# Install dependencies
RUN apt-get update && \
    apt-get install -y ffmpeg curl ca-certificates && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -o /usr/local/bin/yt-dlp && \
    chmod +x /usr/local/bin/yt-dlp

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY . .

# 🔴 VERY IMPORTANT FOR RAILWAY
EXPOSE 8080

CMD ["npm", "start"]
