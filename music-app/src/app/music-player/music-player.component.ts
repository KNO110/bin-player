import { Component, OnInit, ViewChildren, ElementRef, QueryList, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-music-player',
  templateUrl: './music-player.component.html',
  styleUrls: ['./music-player.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatToolbarModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
  ],
})
export class MusicPlayerComponent implements OnInit {
  audio = new Audio();
  songs: any[] = [];
  currentSongIndex: number = -1;
  isPlaying: boolean = false;
  currentTime: number = 0;
  duration: number = 0;
  volume: number = 1;
  repeatMode: boolean = false;
  shuffleMode: boolean = false;
  searchQuery: string = '';
  playlists: any[] = [];
  currentPlaylist: any = null;

  @ViewChildren('coverInputs') coverInputList!: QueryList<ElementRef>;
  @ViewChild('songListContainer') songListContainer!: ElementRef;

  constructor(private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.loadPlaylists();

    const savedPlaylistName = localStorage.getItem('currentPlaylist');
    if (savedPlaylistName) {
      this.currentPlaylist = this.playlists.find(p => p.name === savedPlaylistName);
      if (this.currentPlaylist) {
        this.songs = this.currentPlaylist.songs;
        if (this.songs.length > 0) {
          this.showImportSnackbar();
        }
      }
    } else {
      if (this.playlists.length > 0) {
        this.currentPlaylist = this.playlists[0];
        this.songs = this.currentPlaylist.songs;
      }
    }
  }

  showImportSnackbar() {
    const snackBarRef = this.snackBar.open('Обнаружен сохраненный плейлист', 'Загрузить', {
      duration: 6000,
    });

    snackBarRef.onAction().subscribe(() => {
      this.loadPlaylist();
    });
  }

  loadPlaylist() {
    if (this.songs.length > 0) {
      this.playSong(0);
    }
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const songUrl = URL.createObjectURL(file);
      const song = {
        name: file.name,
        url: songUrl,
        file: file,
        coverUrl: 'assets/default-cover.png',
      };
      this.songs.push(song);
    }
    if (this.currentSongIndex === -1 && this.songs.length > 0) {
      this.playSong(0);
    }

    setTimeout(() => {
      this.scrollSongListToBottom();
    }, 0);

    this.saveCurrentPlaylist();
  }

  scrollSongListToBottom() {
    if (this.songListContainer) {
      this.songListContainer.nativeElement.scrollTop = this.songListContainer.nativeElement.scrollHeight;
    }
  }

  playSong(index: number) {
    if (this.currentSongIndex !== index) {
      this.currentSongIndex = index;
      this.audio.src = this.songs[index].url;
      this.audio.load();
    }
    this.audio.volume = this.volume;
    this.audio.play();
    this.isPlaying = true;

    this.audio.onended = () => {
      if (this.repeatMode) {
        this.playSong(this.currentSongIndex);
      } else {
        this.nextSong();
      }
    };

    this.audio.ontimeupdate = () => {
      this.currentTime = this.audio.currentTime;
      this.duration = this.audio.duration;
    };
  }

  pauseSong() {
    this.audio.pause();
    this.isPlaying = false;
  }

  nextSong() {
    if (this.shuffleMode) {
      this.playRandomSong();
    } else {
      if (this.currentSongIndex < this.songs.length - 1) {
        this.playSong(this.currentSongIndex + 1);
      } else {
        this.playSong(0);
      }
    }
  }

  prevSong() {
    if (this.shuffleMode) {
      this.playRandomSong();
    } else {
      if (this.currentSongIndex > 0) {
        this.playSong(this.currentSongIndex - 1);
      } else {
        this.playSong(this.songs.length - 1);
      }
    }
  }

  playRandomSong() {
    if (this.songs.length === 0) return;
    let randomIndex = Math.floor(Math.random() * this.songs.length);
    while (randomIndex === this.currentSongIndex && this.songs.length > 1) {
      randomIndex = Math.floor(Math.random() * this.songs.length);
    }
    this.playSong(randomIndex);
  }

  seek(event: any) {
    const value = event.target.value;
    this.audio.currentTime = value;
  }

  changeVolume(event: any) {
    const value = event.target.value;
    this.volume = value;
    this.audio.volume = this.volume;
  }

  get volumeIcon(): string {
    if (this.volume === 0) {
      return 'volume_off';
    } else if (this.volume > 0 && this.volume <= 0.5) {
      return 'volume_down';
    } else {
      return 'volume_up';
    }
  }

  toggleRepeat() {
    this.repeatMode = !this.repeatMode;
  }

  toggleShuffle() {
    this.shuffleMode = !this.shuffleMode;
  }

  removeSong(index: number) {
    if (index === this.currentSongIndex) {
      this.pauseSong();
      this.currentSongIndex = -1;
    }
    this.songs.splice(index, 1);
    if (this.songs.length === 0) {
      this.currentSongIndex = -1;
      this.isPlaying = false;
    }
    this.saveCurrentPlaylist();
  }

  formatTime(time: number): string {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const secondsString = seconds < 10 ? '0' + seconds : seconds.toString();
    return `${minutes}:${secondsString}`;
  }

  get filteredSongs() {
    return this.songs.filter(song =>
      song.name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  onCoverSelected(event: any, song: any) {
    const file = event.target.files[0];
    if (file) {
      song.coverUrl = URL.createObjectURL(file);
      this.saveCurrentPlaylist();
    }
  }

  onCoverButtonClicked(index: number) {
    const inputEl = this.coverInputList.toArray()[index].nativeElement as HTMLInputElement;
    inputEl.click();
  }

  saveCurrentPlaylist() {
    if (this.currentPlaylist) {
      this.currentPlaylist.songs = this.songs;
      localStorage.setItem('playlists', JSON.stringify(this.playlists));
      localStorage.setItem('currentPlaylist', this.currentPlaylist.name);
    }
  }

  loadPlaylists() {
    const savedPlaylists = localStorage.getItem('playlists');
    if (savedPlaylists) {
      this.playlists = JSON.parse(savedPlaylists);
    } else {
      this.currentPlaylist = { name: 'Мой плейлист', songs: [] };
      this.playlists.push(this.currentPlaylist);
      localStorage.setItem('playlists', JSON.stringify(this.playlists));
      localStorage.setItem('currentPlaylist', this.currentPlaylist.name);
    }
  }

  createNewPlaylist() {
    const playlistName = prompt('Введите название нового плейлиста');
    if (playlistName) {
      const newPlaylist = { name: playlistName, songs: [] };
      this.playlists.push(newPlaylist);
      this.currentPlaylist = newPlaylist;
      this.songs = this.currentPlaylist.songs;
      this.pauseSong();
      this.currentSongIndex = -1;
      this.isPlaying = false;
      localStorage.setItem('playlists', JSON.stringify(this.playlists));
      localStorage.setItem('currentPlaylist', this.currentPlaylist.name);
    }
  }

  deletePlaylist(playlistName: string) {
    if (confirm(`Вы уверены, что хотите удалить плейлист "${playlistName}"?`)) {
      const index = this.playlists.findIndex(p => p.name === playlistName);
      if (index !== -1) {
        this.playlists.splice(index, 1);
        if (this.currentPlaylist.name === playlistName) {
          this.pauseSong();
          this.currentSongIndex = -1;
          this.isPlaying = false;
          if (this.playlists.length > 0) {
            this.currentPlaylist = this.playlists[0];
            this.songs = this.currentPlaylist.songs;
          } else {
            this.currentPlaylist = null;
            this.songs = [];
          }
        }
        localStorage.setItem('playlists', JSON.stringify(this.playlists));
        if (this.currentPlaylist) {
          localStorage.setItem('currentPlaylist', this.currentPlaylist.name);
        } else {
          localStorage.removeItem('currentPlaylist');
        }
      }
    }
  }

  editSongName(song: any) {
    const newName = prompt('Введите новое название песни', song.name);
    if (newName) {
      song.name = newName;
      this.saveCurrentPlaylist();
    }
  }

  clearPlaylist() {
    if (confirm('Вы уверены, что хотите очистить текущий плейлист?')) {
      this.songs = [];
      this.pauseSong();
      this.currentSongIndex = -1;
      this.isPlaying = false;
      this.saveCurrentPlaylist();
    }
  }

  prevPlaylist() {
    if (this.playlists.length > 1 && this.currentPlaylist) {
      let currentIndex = this.playlists.findIndex(p => p.name === this.currentPlaylist.name);
      if (currentIndex > 0) {
        currentIndex--;
      } else {
        currentIndex = this.playlists.length - 1;
      }
      this.selectPlaylist(this.playlists[currentIndex].name);
    }
  }

  nextPlaylist() {
    if (this.playlists.length > 1 && this.currentPlaylist) {
      let currentIndex = this.playlists.findIndex(p => p.name === this.currentPlaylist.name);
      if (currentIndex < this.playlists.length - 1) {
        currentIndex++;
      } else {
        currentIndex = 0;
      }
      this.selectPlaylist(this.playlists[currentIndex].name);
    }
  }

  selectPlaylist(playlistName: string) {
    this.currentPlaylist = this.playlists.find(p => p.name === playlistName);
    if (this.currentPlaylist) {
      this.songs = this.currentPlaylist.songs;
      this.pauseSong();
      this.currentSongIndex = -1;
      this.isPlaying = false;
      localStorage.setItem('currentPlaylist', this.currentPlaylist.name);
      if (this.songs.length > 0) {
        this.playSong(0);
      }
    }
  }
}
