import os
import requests
import shutil
import gzip
import subprocess

class ICGC():
    
    api_url = 'https://dcc.icgc.org/api/v1/projects?filters=%7B%7D&size=100&sort=totalLiveDonorCount&order=desc'

    @staticmethod
    def get_ssm_projects():
        ssm_projects = []
        r = requests.get(ICGC.api_url)
        
        # Filter by those that have ssm datasets
        if r.status_code == requests.codes.OK:
            all_projects = r.json()
            
            for project in all_projects['hits']:
                if 'ssm' in project['availableDataTypes']:
                    ssm_projects.append(project)
        
        # Sort by dataset name
        ssm_projects.sort(key=lambda x: x['name'])
        return ssm_projects
    
    @staticmethod
    def download_dataset(dataset_id):
        url = 'https://dcc.icgc.org/api/v1/download?fn=/release_25/Projects/' + dataset_id + '/simple_somatic_mutation.open.' + dataset_id + '.tsv.gz'
        gz_filename = os.path.join('data_temp', url.split('/')[-1])
        new_filename = os.path.join('data_temp', 'extracted_data.tsv')
        r = requests.get(url, stream=True)
        # Save dataset .tsv.gz file
        with open(gz_filename, 'wb') as f:
            shutil.copyfileobj(r.raw, f)
        # Extract to .tsv file
        with gzip.open(gz_filename, 'rb') as f_in, open(new_filename, 'wb') as f_out:
            shutil.copyfileobj(f_in, f_out)
        # Delete .tsv.gz file
        try:
            os.remove(gz_filename)
        except OSError:
            print("File not deleted")

        return new_filename
    
    @staticmethod
    def deconstruct_sigs(dataset_filename, onExit):
        # Call R script to compute signature contributions
        # Possibly port this to python in the future
        
        proc = subprocess.check_call(["r", "/app/r/deconstruct.r"])
        onExit()
        return