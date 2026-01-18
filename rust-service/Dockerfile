# Dockerfile for HumanGrid Protocol Service
FROM rust:1.75 as builder

WORKDIR /app

# Copy manifests
COPY Cargo.toml ./

# Copy source code
COPY src ./src

# Build for release
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

# Install required dependencies
RUN apt-get update && \
    apt-get install -y ca-certificates libssl3 && \
    rm -rf /var/lib/apt/lists/*

# Copy the binary from builder
COPY --from=builder /app/target/release/humangrid-service /usr/local/bin/

# Expose port
EXPOSE 8080

# Set environment
ENV RUST_LOG=info

# Run the service
CMD ["humangrid-service"]
