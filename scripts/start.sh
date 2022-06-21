[ ! -d "node_modules/" ] && npm install
# NODE_ENV=production node .
until NODE_ENV=production node .; do
    echo "Server 'myserver' crashed with exit code $?.  Respawning.." >&2
    sleep 1
done