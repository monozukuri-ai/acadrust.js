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
    "unsupportedEntityCount": 0
  },
  "entities": [
    {
      "type": "LINE",
      "handle": "10",
      "layer": "GEOMETRY",
      "variant": "Line",
      "data": {
        "common": {
          "color": "ByLayer",
          "extended_data": {
            "records": []
          },
          "handle": 16,
          "invisible": false,
          "layer": "GEOMETRY",
          "line_weight": "ByLayer",
          "linetype": "",
          "linetype_scale": 1,
          "owner_handle": 21,
          "reactors": [],
          "transparency": 0,
          "xdictionary_handle": null
        },
        "end": {
          "x": 10,
          "y": 20,
          "z": 0
        },
        "normal": {
          "x": 0,
          "y": 0,
          "z": 1
        },
        "start": {
          "x": 0,
          "y": 0,
          "z": 0
        },
        "thickness": 0
      },
      "end": {
        "x": 10,
        "y": 20,
        "z": 0
      },
      "start": {
        "x": 0,
        "y": 0,
        "z": 0
      }
    },
    {
      "type": "CIRCLE",
      "handle": "11",
      "layer": "GEOMETRY",
      "variant": "Circle",
      "data": {
        "center": {
          "x": 5,
          "y": 5,
          "z": 0
        },
        "common": {
          "color": "ByLayer",
          "extended_data": {
            "records": []
          },
          "handle": 17,
          "invisible": false,
          "layer": "GEOMETRY",
          "line_weight": "ByLayer",
          "linetype": "",
          "linetype_scale": 1,
          "owner_handle": 21,
          "reactors": [],
          "transparency": 0,
          "xdictionary_handle": null
        },
        "normal": {
          "x": 0,
          "y": 0,
          "z": 1
        },
        "radius": 2.5,
        "thickness": 0
      },
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
      "variant": "Arc",
      "data": {
        "center": {
          "x": 10,
          "y": 10,
          "z": 0
        },
        "common": {
          "color": "ByLayer",
          "extended_data": {
            "records": []
          },
          "handle": 18,
          "invisible": false,
          "layer": "GEOMETRY",
          "line_weight": "ByLayer",
          "linetype": "",
          "linetype_scale": 1,
          "owner_handle": 21,
          "reactors": [],
          "transparency": 0,
          "xdictionary_handle": null
        },
        "end_angle": 1.5707963267948966,
        "normal": {
          "x": 0,
          "y": 0,
          "z": 1
        },
        "radius": 3,
        "start_angle": 0,
        "thickness": 0
      },
      "center": {
        "x": 10,
        "y": 10,
        "z": 0
      },
      "endAngle": 1.5707963267948966,
      "radius": 3,
      "startAngle": 0
    },
    {
      "type": "LWPOLYLINE",
      "handle": "13",
      "layer": "GEOMETRY",
      "variant": "LwPolyline",
      "data": {
        "common": {
          "color": "ByLayer",
          "extended_data": {
            "records": []
          },
          "handle": 19,
          "invisible": false,
          "layer": "GEOMETRY",
          "line_weight": "ByLayer",
          "linetype": "",
          "linetype_scale": 1,
          "owner_handle": 21,
          "reactors": [],
          "transparency": 0,
          "xdictionary_handle": null
        },
        "constant_width": 0,
        "elevation": 0,
        "is_closed": true,
        "normal": {
          "x": 0,
          "y": 0,
          "z": 1
        },
        "plinegen": false,
        "thickness": 0,
        "vertices": [
          {
            "bulge": 0,
            "end_width": 0,
            "location": {
              "x": 0,
              "y": 0
            },
            "start_width": 0
          },
          {
            "bulge": 0,
            "end_width": 0,
            "location": {
              "x": 1,
              "y": 0
            },
            "start_width": 0
          },
          {
            "bulge": 0,
            "end_width": 0,
            "location": {
              "x": 1,
              "y": 1
            },
            "start_width": 0
          }
        ]
      },
      "closed": true,
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
      ]
    },
    {
      "type": "TEXT",
      "handle": "14",
      "layer": "ANNOTATION",
      "variant": "Text",
      "data": {
        "alignment_point": null,
        "common": {
          "color": "ByLayer",
          "extended_data": {
            "records": []
          },
          "handle": 20,
          "invisible": false,
          "layer": "ANNOTATION",
          "line_weight": "ByLayer",
          "linetype": "",
          "linetype_scale": 1,
          "owner_handle": 21,
          "reactors": [],
          "transparency": 0,
          "xdictionary_handle": null
        },
        "height": 0.5,
        "horizontal_alignment": "Left",
        "insertion_point": {
          "x": 2,
          "y": 3,
          "z": 0
        },
        "normal": {
          "x": 0,
          "y": 0,
          "z": 1
        },
        "oblique_angle": 0,
        "rotation": 0.004363323129985824,
        "style": "STANDARD",
        "value": "Hello CAD",
        "vertical_alignment": "Baseline",
        "width_factor": 1
      },
      "height": 0.5,
      "insertionPoint": {
        "x": 2,
        "y": 3,
        "z": 0
      },
      "rotation": 0.004363323129985824,
      "value": "Hello CAD"
    },
    {
      "type": "MTEXT",
      "handle": "15",
      "layer": "ANNOTATION",
      "variant": "MText",
      "data": {
        "attachment_point": "TopLeft",
        "common": {
          "color": "ByLayer",
          "extended_data": {
            "records": []
          },
          "handle": 21,
          "invisible": false,
          "layer": "ANNOTATION",
          "line_weight": "ByLayer",
          "linetype": "",
          "linetype_scale": 1,
          "owner_handle": 21,
          "reactors": [],
          "transparency": 0,
          "xdictionary_handle": null
        },
        "drawing_direction": "LeftToRight",
        "height": 0.75,
        "insertion_point": {
          "x": 4,
          "y": 5,
          "z": 0
        },
        "line_spacing_factor": 1,
        "normal": {
          "x": 0,
          "y": 0,
          "z": 1
        },
        "rectangle_height": null,
        "rectangle_width": 10,
        "rotation": 0,
        "style": "STANDARD",
        "value": "Unsupported projection"
      },
      "height": 0.75,
      "insertionPoint": {
        "x": 4,
        "y": 5,
        "z": 0
      },
      "rotation": 0,
      "value": "Unsupported projection"
    }
  ]
};
