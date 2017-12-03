import os
import json
from icgc import ICGC

from flask import Flask, send_file, render_template, request, jsonify

app = Flask(__name__)


@app.route("/")
def main():
    return render_template('index.html', icgc_ssm_projects=ICGC.get_ssm_projects())

@app.route("/dataset-select", methods=['POST'])
def dataset_select():
    form_data = request.get_json(force=True)
    dataset_id = form_data['dataset_id']
    dataset_filename = ICGC.download_dataset(dataset_id)
    ICGC.deconstruct_sigs(dataset_filename)
    return jsonify({"success": True})

# Everything not declared before (not a Flask route / API endpoint)...
@app.route('/<path:path>')
def route_frontend(path):
    # ...could be a static file needed by the front end that
    # doesn't use the `static` path (like in `<script src="bundle.js">`)
    file_path = os.path.join(app.static_folder, path)
    if os.path.isfile(file_path):
        return send_file(file_path)
    # ...default to index when not found
    else:
        main()


if __name__ == "__main__":
    # Only for debugging while developing
    app.run(host='0.0.0.0', debug=True, port=80)
