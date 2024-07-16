export const getAngle = (p1: __esri.Point, p2: __esri.Point) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y
    let rad = Math.atan2(dy, dx) - Math.PI / 2;

    if (rad < 0) {
        rad += 2 * Math.PI;
    }
    return radToDeg(rad);
}

const radToDeg = (angle: number) => {
    return 180 * angle / Math.PI;
}
