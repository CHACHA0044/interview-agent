"""
Purpose:
Loads and parses the curriculum.json file strictly for deterministic orchestration logic.

Responsibilities:
- Reads the local `curriculum.json` safely.
- Exposes strongly typed Pydantic models representing modules and days.
- Provides lookup functions for fast mapping of day -> module.

Connected Files:
- app/services/curriculum_selection.py

Important implementation notes:
- This is NOT a vector database or embedding ingestion script. It is just for fast JSON lookup.
"""

import json
import os
from typing import List, Dict, Optional
from pydantic import BaseModel


class CurriculumDayDef(BaseModel):
    day: int
    title: str
    type: str
    tools: List[str] = []
    objectives: List[str] = []


class CurriculumModuleDef(BaseModel):
    n: int
    title: str
    days: List[int]


class CurriculumSchema(BaseModel):
    cohort: str
    modules: List[CurriculumModuleDef]
    days: List[CurriculumDayDef]


class CurriculumLoader:
    _instance: Optional['CurriculumLoader'] = None
    
    def __init__(self, file_path: str = "../../../curriculum.json"):
        # Since this service runs inside backend/services/interview-agent/app/services
        # The curriculum.json is at the root of interview-agent (3 dirs up from the microservice root, maybe 4 from here)
        # We will determine path dynamically
        current_dir = os.path.dirname(os.path.abspath(__file__))
        root_dir = os.path.abspath(os.path.join(current_dir, "..", "..", "..", ".."))
        default_path = os.path.join(root_dir, "curriculum.json")

        # Allow an explicit override (docker-compose mounts curriculum.json and sets CURRICULUM_PATH).
        env_path = os.environ.get("CURRICULUM_PATH")
        if env_path:
            target_path = env_path
        else:
            target_path = file_path if os.path.isabs(file_path) else default_path
        
        try:
            with open(target_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self.data = CurriculumSchema(**data)
            
            # Build fast lookup indexes
            self.day_map: Dict[int, CurriculumDayDef] = {d.day: d for d in self.data.days}
            self.module_day_map: Dict[int, int] = {}
            for mod in self.data.modules:
                for day_id in mod.days:
                    self.module_day_map[day_id] = mod.n
                    
        except FileNotFoundError:
            raise FileNotFoundError(f"Could not find curriculum.json at {target_path}")
        except Exception as e:
            raise ValueError(f"Failed to parse curriculum: {e}")

    @classmethod
    def get_instance(cls, file_path: Optional[str] = None) -> 'CurriculumLoader':
        if cls._instance is None:
            if file_path:
                cls._instance = cls(file_path)
            else:
                cls._instance = cls()
        return cls._instance
    
    def get_day(self, day_id: int) -> Optional[CurriculumDayDef]:
        return self.day_map.get(day_id)
        
    def get_module_for_day(self, day_id: int) -> Optional[int]:
        return self.module_day_map.get(day_id)
