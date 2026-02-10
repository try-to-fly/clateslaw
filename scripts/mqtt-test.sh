#!/bin/bash
# MQTT 状态模拟测试脚本

HOST="${MQTT_HOST:-127.0.0.1}"
PORT="${MQTT_PORT:-1883}"
PREFIX="${MQTT_PREFIX:-teslamate}"
CAR_ID="${CAR_ID:-1}"

pub() {
  mosquitto_pub -h "$HOST" -p "$PORT" -t "$PREFIX/cars/$CAR_ID/$1" -m "$2"
  echo "发送: $1 = $2"
}

case "$1" in
  # 模拟完整行程周期
  drive-cycle)
    echo "=== 模拟行程周期 ==="
    pub "rated_battery_range_km" "350.5"
    pub "usable_battery_level" "80"
    pub "state" "driving"
    sleep 2
    pub "rated_battery_range_km" "320.0"
    pub "usable_battery_level" "72"
    pub "state" "online"
    ;;

  # 模拟停车后再次驾驶（测试续航变化）
  park-drive)
    echo "=== 模拟停车->驾驶 ==="
    pub "rated_battery_range_km" "300.0"
    pub "usable_battery_level" "70"
    pub "state" "driving"
    ;;

  # 模拟充电周期
  charge-cycle)
    echo "=== 模拟充电周期 ==="
    pub "charging_state" "Charging"
    sleep 2
    pub "rated_battery_range_km" "400.0"
    pub "usable_battery_level" "90"
    pub "charging_state" "Complete"
    ;;

  # 模拟完整停车+充电+驾驶周期
  full-cycle)
    echo "=== 模拟完整周期: 驾驶->停车->充电->驾驶 ==="
    echo "1. 驾驶中..."
    pub "rated_battery_range_km" "350.0"
    pub "usable_battery_level" "80"
    pub "state" "driving"
    sleep 2
    echo "2. 停车（行程结束）..."
    pub "rated_battery_range_km" "300.0"
    pub "usable_battery_level" "70"
    pub "state" "online"
    sleep 2
    echo "3. 开始充电..."
    pub "charging_state" "Charging"
    sleep 2
    echo "4. 充电完成..."
    pub "rated_battery_range_km" "420.0"
    pub "usable_battery_level" "95"
    pub "charging_state" "Complete"
    sleep 2
    echo "5. 停车待机（模拟损耗）..."
    pub "rated_battery_range_km" "418.0"
    pub "usable_battery_level" "94"
    sleep 2
    echo "6. 开始驾驶..."
    pub "state" "driving"
    ;;

  # 模拟软件更新
  update)
    echo "=== 模拟软件更新 ==="
    pub "update_version" "2024.38.1"
    pub "update_available" "true"
    ;;

  # 单独设置续航值
  range)
    pub "rated_battery_range_km" "${2:-350}"
    pub "usable_battery_level" "${3:-80}"
    ;;

  # 单独设置状态
  state)
    pub "state" "${2:-online}"
    ;;

  charging)
    pub "charging_state" "${2:-Disconnected}"
    ;;

  *)
    echo "用法: $0 <command> [args]"
    echo ""
    echo "命令:"
    echo "  drive-cycle    模拟完整行程周期 (driving -> online)"
    echo "  park-drive     模拟停车后开始驾驶 (触发续航变化推送)"
    echo "  charge-cycle   模拟充电周期 (Charging -> Complete)"
    echo "  full-cycle     模拟完整周期 (驾驶->停车->充电->驾驶)"
    echo "  update         模拟软件更新通知"
    echo "  range [km] [%] 设置续航值 (默认 350km 80%)"
    echo "  state [s]      设置车辆状态 (online/driving/asleep/charging/...)"
    echo "  charging [s]   设置充电状态 (Charging/Complete/Disconnected/...)"
    echo ""
    echo "环境变量:"
    echo "  MQTT_HOST   MQTT 服务器地址 (默认: 127.0.0.1)"
    echo "  MQTT_PORT   MQTT 端口 (默认: 1883)"
    echo "  MQTT_PREFIX Topic 前缀 (默认: teslamate)"
    echo "  CAR_ID      车辆 ID (默认: 1)"
    ;;
esac
