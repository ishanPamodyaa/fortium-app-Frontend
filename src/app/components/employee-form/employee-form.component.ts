import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  EmployeeService,
  Employee,
  Department,
} from '../../services/employee.service';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './employee-form.component.html',
  styleUrl: './employee-form.component.css',
})
export class EmployeeFormComponent implements OnInit {
  employeeForm!: FormGroup;
  isEditMode = false;
  employeeId?: number;
  loading = false;
  submitted = false;
  error = '';
  departments = Object.values(Department);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private employeeService: EmployeeService
  ) {}

  ngOnInit(): void {
    this.initForm();

    // Check if we're in edit mode
    this.employeeId = +this.route.snapshot.paramMap.get('id')!;
    this.isEditMode = !isNaN(this.employeeId);

    if (this.isEditMode && this.employeeId) {
      this.loading = true;
      this.employeeService.getEmployeeById(this.employeeId).subscribe({
        next: (employee) => {
          this.employeeForm.patchValue(employee);
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Error loading employee data. Please try again.';
          this.loading = false;
          console.error('Error loading employee:', error);
        },
      });
    }
  }

  initForm(): void {
    this.employeeForm = this.fb.group({
      nic: [
        '',
        [Validators.required, Validators.pattern(/^[0-9]{12}$|^[0-9]{9}[Vv]$/)],
      ],
      name: [
        '',
        [
          Validators.required,
          Validators.maxLength(100),
          Validators.pattern(/^[A-Za-z\s]+$/),
        ],
      ],
      email: ['', [Validators.required, Validators.email]],
      department: ['', Validators.required],
    });
  }

  get f() {
    return this.employeeForm.controls;
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.employeeForm.invalid) {
      return;
    }

    const employeeData: Employee = this.employeeForm.value;
    this.loading = true;

    if (this.isEditMode && this.employeeId) {
      this.employeeService
        .updateEmployee(this.employeeId, employeeData)
        .subscribe({
          next: () => {
            this.loading = false;
            alert('Employee updated successfully!');
            this.router.navigate(['/employees']);
          },
          error: (error) => {
            this.loading = false;
            this.error = this.getErrorMessage(error);
            console.error('Error updating employee:', error);
          },
        });
    } else {
      this.employeeService.createEmployee(employeeData).subscribe({
        next: () => {
          this.loading = false;
          alert('Employee added successfully!');
          this.router.navigate(['/employees']);
        },
        error: (error) => {
          this.loading = false;
          this.error = this.getErrorMessage(error);
          console.error('Error creating employee:', error);
        },
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/employees']);
  }

  private getErrorMessage(error: any): string {
    if (error.status === 409) {
      return 'An employee with this email or NIC already exists.';
    } else if (error.error && error.error.message) {
      return error.error.message;
    } else {
      return 'An error occurred. Please try again.';
    }
  }
}
