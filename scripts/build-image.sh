#!/bin/sh
# Builds the container image with containerd (nerdctl + BuildKit) – no Docker needed.
#   sh scripts/build-image.sh [image-name:tag]
# Needs: containerd running, nerdctl, and buildkitd (https://github.com/moby/buildkit/releases).
#   If buildkitd is not running:  sudo buildkitd --oci-worker=false --containerd-worker=true &
set -e
IMAGE="${1:-school-website-cms:latest}"
NS="${CONTAINERD_NAMESPACE:-default}"
cd "$(dirname "$0")/.."
sudo env "PATH=$PATH" nerdctl --namespace "$NS" build -t "$IMAGE" --build-arg BUILD_HEAP="${BUILD_HEAP:-1536}" .
echo "Built $IMAGE in containerd namespace '$NS'."
echo "Run it:  IMAGE=$IMAGE sudo nerdctl --namespace $NS compose up -d"
