cmake_minimum_required(VERSION 3.20)
project(serverAPI)

# Указать использовать Boost.Asio
add_definitions(-DCROW_USE_BOOST_ASIO)

# Найти Boost
find_package(Boost 1.78 REQUIRED COMPONENTS system filesystem)
find_package(OpenSSL REQUIRED)

find_library(PQXX_LIBRARY NAMES pqxx)
find_path(PQXX_INCLUDE_DIR NAMES pqxx/pqxx)

if(NOT PQXX_LIBRARY OR NOT PQXX_INCLUDE_DIR)
    message(FATAL_ERROR "libpqxx not found")
endif()

include_directories(
    ${CMAKE_SOURCE_DIR}/crow/include/
    ${CMAKE_SOURCE_DIR}/jwt-cpp/include
    ${Boost_INCLUDE_DIRS}
    ${OPENSSL_INCLUDE_DIR}
    ${PQXX_INCLUDE_DIR}
)

set(CMAKE_CXX_STANDARD 20)

add_executable(serverAPI main.cpp RESTAPI.h rest_api.cpp)

target_link_libraries(serverAPI
    PRIVATE
    ${PQXX_LIBRARY}
    OpenSSL::SSL
    OpenSSL::Crypto
    Boost::system
    Boost::filesystem
)
