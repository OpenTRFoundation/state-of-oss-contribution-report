import d3, {Selection} from "d3";
import d3cloud from "d3-cloud";

export type WordCloudData = {
    [text:string]:number
};

export class WordCloud {
    private readonly containerName:string;
    private readonly data:WordCloudData;

    constructor(containerName:string, data:WordCloudData) {
        this.containerName = containerName;
        this.data = data;
    }

    draw() {
        const ReferenceWidth = 800;
        const ReferenceHeight = 800;

        // set the dimensions and margins of the graph
        const margin = {top: 10, right: 10, bottom: 10, left: 10};
        const width = ReferenceWidth - margin.left - margin.right;
        const height = ReferenceWidth - margin.top - margin.bottom;

        const svg = d3
            .select(this.containerName)
            .append("svg")
            .attr("viewBox", `0 0 ${ReferenceWidth} ${ReferenceHeight}`);

        const wordSizeArray = Object.entries(this.data).map(function (word, _index) {
            return {text: word[0], size: word[1]};
        });

        let layout = d3cloud()
            .spiral("archimedean") // "archimedean" or "rectangular"
            .size([width, height])
            .words(wordSizeArray)
            .padding(5)        //space between words
            .rotate(function () {
                return ~~(Math.random() * 2) * 90;
            })
            .fontSize(function (d) {
                // font size of words
                return d.size;
            });

        layout = layout.on("end", () => this.drawWithLayout(layout, svg, wordSizeArray));

        layout.start();
    }

    private drawWithLayout(layout:any, svg:Selection<any, any, any, any>, wordSizeArray:{
        size:number;
        text:string
    }[]) {
        svg
            .append("g")
            .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
            .selectAll("text")
            .data(wordSizeArray)
            .enter().append("text")
            .style("font-size", function (d) {
                return d.size;
            })
            .attr("class", "word-cloud-item")
            .attr("text-anchor", "middle")
            .style("font-family", "Impact")
            .attr("transform", function (d:any) {
                return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
            })
            .text(function (d) {
                return d.text;
            });
    }

}


