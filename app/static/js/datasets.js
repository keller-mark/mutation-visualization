var datasetForm = document.getElementById('dataset-form');
var datasetFormSelect = document.getElementById('dataset-form_select');

var datasetLoader = document.getElementById('dataset-loader');

var currDataset = "BRCA-EU";

datasetForm.addEventListener('submit', function(e) {
    e.preventDefault();
    var datasetID = datasetFormSelect.options[datasetFormSelect.selectedIndex].value;
    var formData = JSON.stringify({dataset_id: datasetID});

    toggleDatasetForm(false);

    var socket = io.connect('http://' + document.domain);
    socket.on('connect', function() {
        if(datasetID != currDataset) {
            socket.emit('start_load_dataset', formData);
            currDataset = datasetID;
        }
    });

    socket.on('finish_load_dataset', function(msg) {
        console.log(msg);
        toggleDatasetForm(true);
        socket.disconnect();
    });

    /*d3.json("/dataset-select")
        .post(formData, function(error, text) {
            if (error) throw error;
            toggleDatasetForm(true);
        });*/
});

function toggleDatasetForm(val) {
    datasetForm.style.display = (val ? "inline-block" : "none");
    datasetLoader.style.display = (val ? "none" : "inline-block");
}