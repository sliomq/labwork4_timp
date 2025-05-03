FROM ubuntu:25.04

RUN apt-get update && apt-get install -y \
    software-properties-common \
    cmake \
    g++ \
    pkg-config \
    libasio-dev \
    libpq-dev \
    libpqxx-dev \
    openssl \
    libssl-dev \
    nlohmann-json3-dev \
    && apt-get install -y \
    libboost-all-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .

RUN cmake . && make

CMD ["./serverAPI"]
