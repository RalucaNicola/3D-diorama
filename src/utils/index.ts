const fadeLayer = (layer: __esri.Layer) => {
    const opacity = parseFloat((layer.opacity + 0.02).toFixed(2));
    layer.opacity = opacity;
    if (layer.opacity < 1) {
        window.requestAnimationFrame(function () {
            fadeLayer(layer);
        });
    }
};
export function fadeIn(layer: __esri.Layer) {
    layer.opacity = 0;
    if (!layer.visible) {
        layer.visible = true;
    }
    fadeLayer(layer);
}

export const roundNumber = (number: number, digits: number) => {
    return Number(number.toFixed(digits))
}

export const formatNumber = (number: number) => {
    return new Intl.NumberFormat("en-US").format(number);
};

export const formatDate = (time: number) => {
    const date = new Date(time);
    return new Intl.DateTimeFormat("en-US").format(date);
}
