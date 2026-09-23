from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class EvidenceBase(BaseModel):
    name: str
    url: str = ""
    notes: str = ""
    file_name: str = ""
    content_type: str = ""
    file_size: int = 0
    file_path: str = ""
class EvidenceCreate(EvidenceBase): pass
class EvidenceOut(EvidenceBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class StepBase(BaseModel):
    title: str
    expected_result: str = ""
    actual_result: str = ""
    status: str = "Not run"
    position: int = 0
class StepCreate(StepBase):
    evidences: list[EvidenceCreate] = Field(default_factory=list)
class StepOut(StepBase):
    id: int
    evidences: list[EvidenceOut] = []
    model_config = ConfigDict(from_attributes=True)

class CaseBase(BaseModel):
    title: str
    description: str = ""
    status: str = "Draft"
    owner: str = ""
    requirement: str = ""
    objective: str = ""
    preconditions: str = ""
    test_data: str = ""
    tester: str = ""
    reviewer: str = ""
class CaseCreate(CaseBase):
    steps: list[StepCreate] = Field(default_factory=list)
class CaseOut(CaseBase):
    id: int
    created_at: datetime
    updated_at: datetime
    steps: list[StepOut] = []
    model_config = ConfigDict(from_attributes=True)
