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

# Deployment

- `latest` branch is deployed to https://state.opentr.foundation/
- `main` branch is deployed to https://main--state-of-oss-contribution-report.netlify.app/
- All the other branches are deployed to `https://<branch>--state-of-oss-contribution-report.netlify.app/`.
  Create a branch and push it on the origin to get Netlify to build and deploy it.
  This is the way to show the previous versions of the report.

`history.html` is only referenced from the `latest` branch in all versions of the report. (https://state.opentr.foundation/history.html)

## Acknowledgements

- [src/province-geojson.json](src/province-geojson.json) is taken from https://raw.githubusercontent.com/alpers/Turkey-Maps-GeoJSON/master/tr-cities.json
- [src/province-coordinates.json](src/province-coordinates.json) is built from https://gist.github.com/ismailbaskin/2492196
- Data in [province-populations.json](src/province-populations.json) is taken from Wikipedia.

TODO:
- Show company leaderboard
- Show languages for top projects contributed to?
- Social media tags (OpenTR website is also missing these stuff)
- Favicon
- Google analytics
- Document new report generation process
  - Update the date in the title
  - Update the report data files
  - ...
