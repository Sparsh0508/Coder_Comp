FROM node:20

WORKDIR /app

# Install compilers/interpreters
RUN apt-get update && apt-get install -y \
    python3 \
    g++ \
    gcc \
    openjdk-17-jdk \
    golang-go \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 10000

CMD ["npm", "start"]