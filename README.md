# Backend for Real-Time Markdown Editor

This document provides detailed instructions for setting up and running the backend of the Real-Time Markdown Editor with Live Preview.

## Overview

The backend of this Markdown editor is built using Node.js. It handles the conversion of Markdown to HTML, ensuring that the conversion is done efficiently and accurately.

## Getting Started

### Prerequisites

- Node.js
- Yarn (Package Manager)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/markdown-editor-be.git
   ```

2. Navigate to the backend directory:
   ```bash
   cd markdown-editor-be
   ```

3. Install dependencies using Yarn:
   ```bash
   yarn install
   ```

4. API Documentation:
   ```bash
   http://localhost:8000/api/docs
   ```

### Running the Server

To start the server, run the following command using Yarn:
```bash
yarn start:dev 
OR
docker-compose up
```

This will start the server on port 8000.
