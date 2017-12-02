import requests

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

        ssm_projects.sort(key=lambda x: x['name'])
        return ssm_projects

    