# Configuration System

The payments service uses a flexible configuration system that loads settings from JSON files and allows environment variable overrides.

## Configuration Priority

1. **Environment Variables** (highest priority)
2. **Config Files** (medium priority)  
3. **Default Values** (lowest priority/fallback)

## Configuration Files

- `config/config.development.json` - Development environment settings
- `config/config.production.json` - Production environment settings

The system automatically selects the appropriate config file based on the `NODE_ENV` environment variable.

## Environment Variables

You can override any configuration value using environment variables:

| Environment Variable | Config File Key | Description | Example |
|---------------------|-----------------|-------------|---------|
| `NODE_ENV` | - | Environment (development/production) | `production` |
| `CONFIG_DIR` | - | Config files directory | `./config` |
| `SERVER_PORT` | `server_port` | HTTP server port | `8080` |
| `REDIS_HOST` | `redis_host` | Redis server hostname | `redis-cluster` |
| `REDIS_PORT` | `redis_port` | Redis server port | `6380` |
| `REDIS_PASSWORD` | `redis_password` | Redis server password | `mypassword` |
| `LOG_FILE` | `log_file` | Log file path | `/var/log/payments.log` |

## Usage Examples

### Default Configuration
```bash
# Uses config.development.json by default
node server.js
```

### Production Environment
```bash
# Uses config.production.json
NODE_ENV=production node server.js
```

### Override Specific Values
```bash
# Override server port
SERVER_PORT=8080 node server.js

# Override Redis connection
REDIS_HOST=redis-cluster REDIS_PORT=6380 node server.js

# Override Redis with authentication
REDIS_HOST=redis-cluster REDIS_PASSWORD=mypassword node server.js

# Multiple overrides
NODE_ENV=production SERVER_PORT=8080 REDIS_HOST=redis-prod REDIS_PASSWORD=prodpassword node server.js
```

### Kubernetes/Docker Usage
```yaml
# In your Kubernetes deployment
env:
- name: NODE_ENV
  value: "production"
- name: SERVER_PORT
  value: "3000"
- name: REDIS_HOST
  value: "redis"
- name: REDIS_PASSWORD
  valueFrom:
    secretKeyRef:
      name: redis-credentials
      key: password
- name: LOG_FILE
  value: "/opt/sns/logs/payments.log"
```

## Testing Configuration

Use the test script to verify your configuration:

```bash
# Test default config
node test-config.js

# Test with overrides
SERVER_PORT=8080 REDIS_HOST=custom-redis REDIS_PASSWORD=testpass node test-config.js
```

## Configuration Loading Process

1. **Determine Environment**: Check `NODE_ENV` (defaults to 'development')
2. **Determine Config Directory**: Check `CONFIG_DIR` (defaults to current directory)
3. **Load Base Config**: Load `config.{environment}.json`
4. **Apply Overrides**: Environment variables override file values
5. **Return Final Config**: Merged configuration object

## Error Handling

- If config file is missing, the system falls back to default values
- Invalid environment variables are ignored (falls back to config file values)
- Configuration loading is logged for debugging

## Best Practices

1. **Development**: Use config files for local development settings
2. **Production**: Use environment variables for sensitive/environment-specific values
3. **Containers**: Set environment variables in your container orchestration platform
4. **Testing**: Use the test script to validate configuration before deployment
5. **Security**: Never commit sensitive values (like Redis passwords) to config files, use environment variables or Kubernetes secrets instead

## Security Considerations

### Redis Password Security

- **Development**: Use `null` in `config.development.json` for local Redis without auth
- **Production**: 
  - **Option 1**: Use environment variable `REDIS_PASSWORD=yourpassword`
  - **Option 2**: Use Kubernetes secret with `valueFrom.secretKeyRef`
  - **Option 3**: Set in config file only if file is properly secured
  
### Recommended Production Setup

```yaml
# Create a Redis password secret
apiVersion: v1
kind: Secret
metadata:
  name: redis-credentials
type: Opaque
data:
  password: <base64-encoded-password>

---
# Reference it in your deployment
spec:
  template:
    spec:
      containers:
      - name: payments
        env:
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: redis-credentials
              key: password
```
