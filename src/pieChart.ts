import d3 from "d3";

export type PieChartData = {
    [bucket:string]:number;
};

const CHART_REFERENCE_WIDTH = 800;
const CHART_REFERENCE_HEIGHT = CHART_REFERENCE_WIDTH * 0.75;
const MARGIN = 50;

export class PieChart {
    private readonly chartContainerName:string;
    private readonly data:PieChartData;

    constructor(chartContainerName:string, data:PieChartData) {
        this.chartContainerName = chartContainerName;
        this.data = data;
    }

    draw() {
        const radius = Math.min(CHART_REFERENCE_WIDTH, CHART_REFERENCE_HEIGHT) / 2 - MARGIN

        const svg = d3.select(this.chartContainerName)
            .append("svg")
            .classed("pie-chart", true)
            .attr("viewBox", `0 0 ${CHART_REFERENCE_WIDTH} ${CHART_REFERENCE_HEIGHT}`)
            .append("g")
            .attr("transform", `translate(${CHART_REFERENCE_WIDTH / 2}, ${CHART_REFERENCE_HEIGHT / 2})`);

        // set the color scale
        const color = d3.scaleOrdinal()
            .range(d3.schemeSet2);

        // Compute the position of each slice
        const pieGenerator = d3.pie()
            .value((d) => {
                return (<any>d)[1];
            });

        const sliceData = pieGenerator(<any>Object.entries(this.data));

        const arcGenerator = d3.arc()
            .innerRadius(0)
            .outerRadius(radius);

        const labelArcGenerator = d3.arc()
            .innerRadius(radius * 0.6)
            .outerRadius(radius);

        // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
        svg
            .selectAll('mySlices')
            .data(sliceData)
            .join('path')
            .attr('d', <any>arcGenerator)
            .attr('fill', function (d:any) {
                return <any>(color(d.data[0]))
            })
            .attr("class", "pie-chart-slice");

        // Now add the annotation. Use the centroid method to get the best coordinates
        svg
            .selectAll('mySlices')
            .data(sliceData)
            .join('text')
            .attr("transform", function (d) {
                return `translate(${labelArcGenerator.centroid(<any>d)})`
            })
            .attr("class", "pie-chart-label")

            .selectAll("tspan")
            .data(d => {
                return [(<any>d).data[0], `(${(<any>d).data[1]}%)`];
            })
            .join("tspan")
            .attr("x", 0)
            .attr("y", (_, i) => `${i * 1.1}em`)
            .attr("font-weight", (_, i) => i ? null : "bold")
            .text(d => d);
    }
}
