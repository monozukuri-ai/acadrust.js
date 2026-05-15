window.ACADRUST_SAMPLE = {
  "version": "AC1015",
  "summary": {
    "version": "AC1015",
    "entityCount": 6,
    "layers": [
      "0"
    ],
    "blocks": [
      "*Model_Space",
      "*Paper_Space"
    ],
    "unsupportedEntityCount": 1
  },
  "entities": [
    {
      "type": "LINE",
      "handle": "10",
      "layer": "GEOMETRY",
      "start": {
        "x": 0,
        "y": 0,
        "z": 0
      },
      "end": {
        "x": 10,
        "y": 20,
        "z": 0
      }
    },
    {
      "type": "CIRCLE",
      "handle": "11",
      "layer": "GEOMETRY",
      "center": {
        "x": 5,
        "y": 5,
        "z": 0
      },
      "radius": 2.5
    },
    {
      "type": "ARC",
      "handle": "12",
      "layer": "GEOMETRY",
      "center": {
        "x": 10,
        "y": 10,
        "z": 0
      },
      "radius": 3,
      "startAngle": 0,
      "endAngle": 1.5707963267948966
    },
    {
      "type": "POLYLINE",
      "handle": "13",
      "layer": "GEOMETRY",
      "vertices": [
        {
          "x": 0,
          "y": 0,
          "z": 0
        },
        {
          "x": 1,
          "y": 0,
          "z": 0
        },
        {
          "x": 1,
          "y": 1,
          "z": 0
        }
      ],
      "closed": true
    },
    {
      "type": "TEXT",
      "handle": "14",
      "layer": "ANNOTATION",
      "value": "Hello CAD",
      "insertionPoint": {
        "x": 2,
        "y": 3,
        "z": 0
      },
      "height": 0.5,
      "rotation": 0.004363323129985824
    },
    {
      "type": "UNKNOWN",
      "handle": "15",
      "layer": "ANNOTATION",
      "rawType": "MTEXT"
    }
  ]
};
