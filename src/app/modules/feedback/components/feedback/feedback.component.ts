import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { FeedbackService } from '../../services/feedback.service';
import { ToastrServiceService } from 'src/app/shared/services/toastr/toastr.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.scss']
})
export class FeedbackComponent {
  public feedbackForm: FormGroup;
  guestName: "";
  ticketId: "";
  ticketTitle: "";
  resolutionComment: "";
  isProcessing: boolean= false;
  constructor( 
    private formBuilder: FormBuilder,
    private feedbackService: FeedbackService,
    private toastrService: ToastrServiceService,
    private route: ActivatedRoute,
    ){

  }

  ngOnInit() {
    this.route.queryParams.subscribe(params=> {
      this.guestName= params['guestName'];
      this.ticketId= params['ticketId'];
      this.ticketTitle=  params['ticketTitle'];
      this.resolutionComment=  params['resolutionComment'];
    })
    this.initForm();
  }

  initForm(){
    this.feedbackForm = this.formBuilder.group({
      rating: new FormControl('', [Validators.required]),
      comment: new FormControl(''),
    }); 
  }

  onSubmit() {
    console.log(this.feedbackForm.value);
    const { rating, comment } = this.feedbackForm.value;
    const feedbackDetails = {
      rating,
      comment
    }
    this.isProcessing=true;
    this.feedbackService.saveFeedack(feedbackDetails).subscribe({
      next: (res) => {
        this.toastrService.showToastr("Your feedback is saved successfully!", 'Success', 'success', '');
        this.isProcessing= false;
      },
      error: (error) => {
        this.toastrService.showToastr(error, 'Error', 'error', '');
        this.isProcessing= false;
      }
    })

  }

  updateRating(event: any) {
    this.feedbackForm.setValue({rating: event?.rating})
  }
}
