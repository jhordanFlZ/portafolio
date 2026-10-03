import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ThreeService } from '../../services/three.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') private canvasRef!: ElementRef<HTMLCanvasElement>;

  constructor(private threeService: ThreeService) {}

  ngAfterViewInit(): void {
    if (typeof window !== 'undefined') {
      this.threeService.init(this.canvasRef.nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.threeService.cleanup();
  }
}
