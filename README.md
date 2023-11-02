# OpenTR - State of Open Source Contribution in Turkey - Report

This repository contains the source code for the OpenTR's [State of Open Source Contribution in Turkey](https://state.opentr.foundation/) report.


## Implementation

This report uses data collected in [OpenTRFoundation/state-of-oss-contribution](https://github.com/OpenTRFoundation/state-of-oss-contribution) repository.
To see how the data collected and processed, visit [OpenTRFoundation/state-of-oss-contribution](https://github.com/OpenTRFoundation/state-of-oss-contribution) repository.

The data is visualized using D3.js.

## Development

To build the project:
```
npm run build
```

or, to serve locally:

```
npm run serve
```

## Acknowledgements

- [src/province-geojson.json](src/province-geojson.json) is taken from https://raw.githubusercontent.com/alpers/Turkey-Maps-GeoJSON/master/tr-cities.json
- [src/province-coordinates.json](src/province-coordinates.json) is built from https://gist.github.com/ismailbaskin/2492196
- Data in [province-populations.json](src/province-populations.json) is taken from Wikipedia.

TODO:
- CI for building the report automatically deploying it to Netlify in a subdomain
  - Quarterly releases of the report - live on branches, deployed on different subdomains in Netlify
  - Index page with links to the latest report and the previous reports - that always lives on the main subdomain
- Show company leaderboard
- Show languages for top projects contributed to?
- Social media tags (OpenTR website is also missing these stuff)
- Favicon
- Document new report generation process
  - Update the date in the title
  - Update the report data files
  - ...
