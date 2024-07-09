/** @type {import('next').NextConfig} */

const BACKEND_HOST = "";
const nextConfig = {
    env: {
        "DISCORD_WEBHOOK": "",

        "LOGIN_AUTH": `${BACKEND_HOST}/auth/login`,
        "VEHICLE": `${BACKEND_HOST}/vehicle/`,
        "VEHICLE_SEARCH": `${BACKEND_HOST}/vehicle/find`,
        "CLIENT": `${BACKEND_HOST}/client`,
        "CLIENT_SEARCH": `${BACKEND_HOST}/client/find`,
        "CLIENT_DISABLE": `${BACKEND_HOST}/client/disable`,
        "SERVICE": `${BACKEND_HOST}/service/`,
        "SERVICE_SEARCH": `${BACKEND_HOST}/service/find`,
        "USER": `${BACKEND_HOST}/user`,
        "USER_SEARCH": `${BACKEND_HOST}/user/find`,
        "USER_UPDATE_PASSWORD": `${BACKEND_HOST}/user/password`,
        "USER_PERMISSIONS": `${BACKEND_HOST}/user/permission`,
        "COMPANY_SEARCH": `${BACKEND_HOST}/company/find`,
        "COMPANY": `${BACKEND_HOST}/company/`,
        "VERSIONING": `${BACKEND_HOST}/versioning/`,
        "VERSIONING_SEARCH": `${BACKEND_HOST}/versioning/find`,

        "TOAST_TIME": 2000,
    }
}

module.exports = nextConfig
