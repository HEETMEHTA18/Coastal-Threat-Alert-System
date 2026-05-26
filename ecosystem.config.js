module.exports = {
  apps: [
    {
      name: 'ctas-ai-mock',
      script: 'ai-models/mock_server.py',
      interpreter: 'python3',
      watch: false,
      env: {
        PYTHONUNBUFFERED: '1'
      }
    },
    {
      name: 'ctas-backend',
      script: 'npm',
      args: 'run dev',
      cwd: './backend',
      watch: false
    },
    {
      name: 'ctas-frontend',
      script: 'npm',
      args: 'run dev',
      cwd: './frontend',
      watch: false
    }
  ]
};
