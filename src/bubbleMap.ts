import d3 from "d3";
import {NumberFormatterEN, NumberFormatterTR, UnknownProvince, UnknownProvinceTR} from "./common";
import _provinceCoordinates from './province-coordinates.json';
import _provinceGeoData from './province-geojson.json';
import _provincePopulationData from './province-populations.json';

const provinceCoordinates = _provinceCoordinates as { [key:string]:{ lat:number, lon:number } };
const provinceGeoData = _provinceGeoData as { features:any[] };
const provincePopulationData = _provincePopulationData as { [key:string]:number };

export type ProvinceName = string;

export type BubbleMapData = {
    [key:ProvinceName]:number;
}

const MAP_REFERENCE_WIDTH = 1440;
const MAP_REFERENCE_HEIGHT = 650;
const TURKEY_CENTER = [35.3, 39] as [number, number];
const TURKEY_SCALE = 4200;
const MIN_MARKER_SIZE = 2;
const DENSITY_BASE = 1_000_000;

type MergedData = {
    [province:string]:{
        count:number,
        population:number,
        density:number,
    }
};

type Marker = {
    long:number,
    lat:number,
    name:string,
    size:number,
};

export class BubbleMap {
    private readonly mapContainerName:string;
    private readonly mapTooltipContainerName:string;
    private readonly data:BubbleMapData;

    constructor(mapContainerName:string, mapTooltipContainerName:string, data:BubbleMapData) {
        this.mapContainerName = mapContainerName;
        this.mapTooltipContainerName = mapTooltipContainerName;
        this.data = data;
    }

    draw() {
        // merge the count data with the population data
        const mergedData:MergedData = {};
        for (const [key, value] of Object.entries(provincePopulationData)) {
            const count = this.data[key] ?? 0;
            const density = count / (provincePopulationData[key] / DENSITY_BASE);

            mergedData[key] = {
                count: count,
                population: value,
                density: density,
            };
        }
        // as the "Unknown" province is not in the population data, add it manually
        mergedData[UnknownProvince] = {
            count: this.data[UnknownProvince] ?? 0,
            population: 0,
            density: 0,
        };

        let densityColorScheme = d3.schemeBlues[6];
        let densityColorDomain = [50, 100, 300, 800, 1500];
        const maxDensity = d3.max(Object.values(mergedData).map(d => d.density));
        if (maxDensity < 100) {
            densityColorDomain = [1, 5, 10];
            densityColorScheme = d3.schemeBlues[3];
        }
        const densityColorScale = d3.scaleThreshold()
            .domain(densityColorDomain)
            .range(<any>densityColorScheme);

        const markerSize = d3.scalePow()
            .domain([1, 100000])  // What's in the data
            .range([1, 50])       // Size in pixel
            .exponent(.2);

        const countryTotalCount = Object.values(this.data).reduce((a, b) => a + b, 0);
        const countryTotalPopulation = Object.values(provincePopulationData).reduce((a, b) => a + b, 0);
        const countryDensity = countryTotalCount / (countryTotalPopulation / DENSITY_BASE);

        const $tooltipParent = jQuery(this.mapTooltipContainerName);

        const $count = $tooltipParent.find(".province-count");
        const $countEN = $count.find("span[lang='en']");
        const $countTR = $count.find("span[lang='tr']");

        const $name = $tooltipParent.find(".province-name");
        const $nameEN = $name.find("span[lang='en']");
        const $nameTR = $name.find("span[lang='tr']");

        const $population = $tooltipParent.find(".province-population");
        const $populationEN = $population.find("span[lang='en']");
        const $populationTR = $population.find("span[lang='tr']");

        const $ratioToPopulation = $tooltipParent.find(".province-count-population-ratio");
        const $ratioToPopulationEN = $ratioToPopulation.find("span[lang='en']");
        const $ratioToPopulationTR = $ratioToPopulation.find("span[lang='tr']");

        const svg = d3
            .select(this.mapContainerName)
            .append("svg")
            .attr("viewBox", `0 0 ${MAP_REFERENCE_WIDTH} ${MAP_REFERENCE_HEIGHT}`);

        const projection = d3.geoMercator()
            .center(TURKEY_CENTER)
            .scale(TURKEY_SCALE)
            .translate([MAP_REFERENCE_WIDTH / 2, MAP_REFERENCE_HEIGHT / 2]);

        const markers:Marker[] = [];
        for (const [key, value] of Object.entries(mergedData)) {
            markers.push({
                long: provinceCoordinates[key].lon,
                lat: provinceCoordinates[key].lat,
                size: value.count,
                name: key
            });
        }

        const resetTooltip = () => {
            // update tooltip to show total
            $nameEN.html("Turkey");
            $nameTR.html("Türkiye");

            $countEN.html(NumberFormatterEN.format(countryTotalCount));
            $countTR.html(NumberFormatterTR.format(countryTotalCount));

            $populationEN.html(NumberFormatterEN.format(countryTotalPopulation));
            $populationTR.html(NumberFormatterTR.format(countryTotalPopulation));

            $ratioToPopulationEN.html(NumberFormatterEN.format(Math.floor(countryDensity)));
            $ratioToPopulationTR.html(NumberFormatterTR.format(Math.floor(countryDensity)));

            jQuery('.map-section').removeClass("translucent");
        }

        function mouseEnter(provinceNameEN:string, provinceNameTR:string, element:any) {
            const count = mergedData[provinceNameEN].count;
            const population = mergedData[provinceNameEN].population;
            const density = mergedData[provinceNameEN].density;

            $nameEN.html(provinceNameEN);
            $nameTR.html(provinceNameTR);

            $countEN.html(NumberFormatterEN.format(count ?? 0));
            $countTR.html(NumberFormatterTR.format(count ?? 0));

            if (population) {
                $populationEN.html(NumberFormatterEN.format(population));
                $populationTR.html(NumberFormatterTR.format(population));
            } else {
                $populationEN.html("-");
                $populationTR.html("-");
            }

            if (density) {
                $ratioToPopulationEN.html(NumberFormatterEN.format(Math.floor(density)));
                $ratioToPopulationTR.html(NumberFormatterTR.format(Math.floor(density)));
            } else {
                $ratioToPopulationEN.html("-");
                $ratioToPopulationTR.html("-");
            }

            jQuery('.map-section').addClass("translucent");
            jQuery(element).removeClass("translucent");
        }

        // Draw the map
        svg
            .append("g")
            .selectAll("path")
            .data(provinceGeoData.features)
            .join("path")
            .attr("d", d3.geoPath().projection(projection))
            .attr("class", "map-section")
            .attr("fill", d => {
                const provinceName = d.properties.name;
                return densityColorScale(mergedData[provinceName].density);
            })
            .on("mouseenter", function (_event, d) {
                const provinceName = d.properties.name;
                mouseEnter(provinceName, provinceName, this);
            })
            .on("mouseleave", function () {
                resetTooltip();
            });

        // draw markers
        svg
            .selectAll()
            .data(markers)
            .join("circle")
            .attr("cx", (d:Marker) => projection([d.long, d.lat])[0])
            .attr("cy", d => projection([d.long, d.lat])[1])
            .attr("r", d => {
                const r = markerSize(d.size);
                return r > 0 ? r + MIN_MARKER_SIZE : 0;
            })
            .attr("class", "bubble")
            .each(function (d) {
                const $this = jQuery(this);
                $this.attr("data-province-name", d.name);
                $this.attr("data-province-count", d.size);

                if (d.name == UnknownProvince) {
                    $this.addClass("unknown-province");
                    this.onmouseenter = function () {
                        mouseEnter(UnknownProvince, UnknownProvinceTR, this);
                    }
                    this.onmouseleave = function () {
                        resetTooltip();
                    };
                }
            });

        resetTooltip();
    }
}
