FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source files
COPY . .

# Make sure the tsconfig.json has correct outDir
# Build TypeScript with explicit include of config directory
RUN npm run build

# Expose the API port
EXPOSE 7070

# Start the server
CMD ["npm", "start"]